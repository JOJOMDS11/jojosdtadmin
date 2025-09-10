require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Função auxiliar para simular handlers Vercel
const createHandler = (handlerModule) => {
    return async (req, res) => {
        try {
            await handlerModule(req, res);
        } catch (error) {
            console.error('Erro no handler:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    };
};

// Simulação das rotas da API (carregamento dinâmico)
app.post('/api/login', createHandler(async (req, res) => {
    const { password } = req.body;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (password === (process.env.ADMIN_PASSWORD || 'admin123')) {
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ success: false, message: 'Senha incorreta' });
    }
}));

app.get('/api/stats', createHandler(async (req, res) => {
    const { query } = require('./api/db');

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // Estatísticas básicas
        const totalPlayers = await query('SELECT COUNT(*) as count FROM players');
        const totalCards = await query('SELECT COUNT(*) as count FROM user_cards');
        const totalTemplates = await query('SELECT COUNT(*) as count FROM player_templates');
        const totalTeams = await query('SELECT COUNT(*) as count FROM teams');

        return res.status(200).json({
            success: true,
            data: {
                totalPlayers: totalPlayers[0]?.count || 0,
                totalCards: totalCards[0]?.count || 0,
                totalTemplates: totalTemplates[0]?.count || 0,
                totalTeams: totalTeams[0]?.count || 0
            }
        });
    } catch (error) {
        console.error('Erro ao buscar stats:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
    }
}));

app.get('/api/teams', createHandler(async (req, res) => {
    const { query } = require('./api/db');

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const teams = await query(`
            SELECT 
                t.*,
                p.name as username
            FROM teams t
            LEFT JOIN players p ON t.owner_discord_id = p.discord_id
            ORDER BY t.wins DESC
        `);
        return res.status(200).json({ success: true, data: teams });
    } catch (error) {
        console.error('Erro ao buscar teams:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar times' });
    }
}));

app.get('/api/teams/search', createHandler(async (req, res) => {
    const { query } = require('./api/db');
    const { name } = req.query;

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!name) {
        return res.status(400).json({ success: false, message: 'Nome do time é obrigatório' });
    }

    try {
        const teams = await query(`
            SELECT 
                t.*,
                p.name as username
            FROM teams t
            LEFT JOIN players p ON t.owner_discord_id = p.discord_id
            WHERE t.name LIKE ? 
            LIMIT 1
        `, [`%${name}%`]);

        if (teams.length > 0) {
            return res.status(200).json({ success: true, data: teams[0] });
        } else {
            return res.status(404).json({ success: false, message: 'Time não encontrado' });
        }
    } catch (error) {
        console.error('Erro ao buscar time:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar time' });
    }
}));

app.get('/api/players', createHandler(async (req, res) => {
    const { query } = require('./api/db');

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const players = await query('SELECT * FROM players ORDER BY purple_coins DESC');
        return res.status(200).json({ success: true, data: players });
    } catch (error) {
        console.error('Erro ao buscar players:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar jogadores' });
    }
}));

app.get('/api/templates', createHandler(async (req, res) => {
    const { query } = require('./api/db');

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const templates = await query('SELECT * FROM player_templates ORDER BY created_at DESC');
        return res.status(200).json({ success: true, data: templates });
    } catch (error) {
        console.error('Erro ao buscar templates:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar templates' });
    }
}));

app.post('/api/templates', createHandler(async (req, res) => {
    const { query } = require('./api/db');
    const { name, position, avatar } = req.body;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!name || !avatar) {
        return res.status(400).json({ success: false, message: 'Nome e avatar são obrigatórios' });
    }

    try {
        await query(
            'INSERT INTO player_templates (name, created_at) VALUES (?, NOW())',
            [name]
        );
        return res.status(200).json({ success: true, message: 'Template criado com sucesso' });
    } catch (error) {
        console.error('Erro ao criar template:', error);
        return res.status(500).json({ success: false, message: 'Erro ao criar template' });
    }
}));

app.get('/api/user/:discordId', createHandler(async (req, res) => {
    const { query } = require('./api/db');
    const { discordId } = req.params;

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // Buscar usuário
        const users = await query('SELECT * FROM players WHERE discord_id = ?', [discordId]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        const user = users[0];

        // Buscar cartas do usuário (ajustado para estrutura atual)
        const cards = await query(`
            SELECT COUNT(*) as total
            FROM user_cards 
            WHERE discord_id = ?
        `, [user.discord_id]);

        // Buscar contagem por raridade
        const cardsByRarity = await query(`
            SELECT 
                rarity,
                COUNT(*) as count
            FROM user_cards 
            WHERE discord_id = ?
            GROUP BY rarity
        `, [user.discord_id]);

        // Organizar contagens por raridade
        const cardStats = {
            total: cards[0]?.total || 0,
            prime: 0,
            goat: 0,
            medio: 0,
            bagre: 0
        };

        cardsByRarity.forEach(row => {
            switch (row.rarity.toLowerCase()) {
                case 'prime':
                    cardStats.prime = row.count;
                    break;
                case 'goat':
                    cardStats.goat = row.count;
                    break;
                case 'médio':
                case 'medio':
                    cardStats.medio = row.count;
                    break;
                case 'bagre':
                    cardStats.bagre = row.count;
                    break;
            }
        });

        return res.status(200).json({
            success: true,
            user: user,
            cards: cardStats
        });

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar usuário' });
    }
}));

app.post('/api/coins', createHandler(async (req, res) => {
    const { query } = require('./api/db');
    const { discordId, amount } = req.body;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!discordId || !amount) {
        return res.status(400).json({ success: false, message: 'Discord ID e quantidade são obrigatórios' });
    }

    try {
        // Verificar se o usuário existe
        const users = await query('SELECT * FROM players WHERE discord_id = ?', [discordId]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        // Adicionar moedas
        await query(
            'UPDATE players SET purple_coins = purple_coins + ? WHERE discord_id = ?',
            [amount, discordId]
        );

        return res.status(200).json({
            success: true,
            message: `${amount} Purple Coins adicionadas com sucesso!`
        });

    } catch (error) {
        console.error('Erro ao adicionar moedas:', error);
        return res.status(500).json({ success: false, message: 'Erro ao adicionar moedas' });
    }
}));

app.delete('/api/templates/:id', createHandler(async (req, res) => {
    const { query } = require('./api/db');
    const { id } = req.params;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await query('DELETE FROM player_templates WHERE id = ?', [id]);
        return res.status(200).json({ success: true, message: 'Template excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir template:', error);
        return res.status(500).json({ success: false, message: 'Erro ao excluir template' });
    }
}));

// Routes for tournaments
app.get('/api/tournaments', createHandler(async (req, res) => {
    const { query } = require('./api/db');

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const tournaments = await query(`
            SELECT 
                t.*,
                COUNT(tr.id) as registered_teams
            FROM tournaments t
            LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `);

        res.json({
            success: true,
            tournaments: tournaments
        });
    } catch (error) {
        console.error('❌ Erro ao buscar torneios:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
}));

app.post('/api/tournaments', createHandler(async (req, res) => {
    const { query } = require('./api/db');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { name, date, time, format, max_players, prize_1st, prize_2nd, prize_3rd } = req.body;

        if (!name || !date || !time || !format || !max_players || !prize_1st || !prize_2nd || !prize_3rd) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        // Verificar se já existe um torneio com o mesmo nome
        const existing = await query('SELECT id FROM tournaments WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um torneio com este nome'
            });
        }

        const result = await query(`
            INSERT INTO tournaments (name, tournament_date, tournament_time, format, max_players, prize_1st, prize_2nd, prize_3rd, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
        `, [name, date, time, format, max_players, prize_1st, prize_2nd, prize_3rd]);

        res.json({
            success: true,
            message: 'Torneio criado com sucesso!',
            tournament_id: result.insertId
        });
    } catch (error) {
        console.error('❌ Erro ao criar torneio:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
}));

app.delete('/api/tournaments/:id', createHandler(async (req, res) => {
    const { query } = require('./api/db');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const tournamentId = req.params.id;

        // Verificar se o torneio existe
        const tournament = await query('SELECT id FROM tournaments WHERE id = ?', [tournamentId]);
        if (tournament.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Torneio não encontrado'
            });
        }

        // Deletar inscrições primeiro
        await query('DELETE FROM tournament_registrations WHERE tournament_id = ?', [tournamentId]);

        // Deletar torneio
        await query('DELETE FROM tournaments WHERE id = ?', [tournamentId]);

        res.json({
            success: true,
            message: 'Torneio deletado com sucesso!'
        });
    } catch (error) {
        console.error('❌ Erro ao deletar torneio:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
}));

app.get('/api/tournaments/:id/registrations', createHandler(async (req, res) => {
    const { query } = require('./api/db');

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const tournamentId = req.params.id;

        const registrations = await query(`
            SELECT 
                tr.*,
                t.name as team_name,
                t.owner_id,
                u.username as owner_username
            FROM tournament_registrations tr
            JOIN teams t ON tr.team_id = t.id
            LEFT JOIN users u ON t.owner_id = u.discord_id
            WHERE tr.tournament_id = ?
            ORDER BY tr.registered_at ASC
        `, [tournamentId]);

        res.json({
            success: true,
            registrations: registrations
        });
    } catch (error) {
        console.error('❌ Erro ao buscar inscrições:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
}));

// Rotas para Torneios
app.get('/api/tournaments', createHandler(async (req, res) => {
    const { query } = require('./api/db');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const tournaments = await query('SELECT * FROM tournaments ORDER BY created_at DESC');
        res.json({ success: true, tournaments: tournaments });
    } catch (error) {
        console.error('❌ Erro ao buscar torneios:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
}));

app.post('/api/tournaments', createHandler(async (req, res) => {
    const { query } = require('./api/db');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { name, date, time, format, max_players, prize_1st, prize_2nd, prize_3rd } = req.body;

        if (!name || !date || !time) {
            return res.status(400).json({ success: false, message: 'Campos obrigatórios: nome, data, hora' });
        }

        const result = await query(`
            INSERT INTO tournaments (name, date, time, format, max_players, prize_1st, prize_2nd, prize_3rd, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', NOW())
        `, [name, date, time, format || 'Mata-mata', max_players || 8, prize_1st || '1000', prize_2nd || '500', prize_3rd || '250']);

        res.json({ success: true, message: 'Torneio criado com sucesso!', tournament_id: result.insertId });
    } catch (error) {
        console.error('❌ Erro ao criar torneio:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
}));

app.post('/api/tournaments/:id/start', createHandler(async (req, res) => {
    const { query } = require('./api/db');
    const { id } = req.params;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
        await query('UPDATE tournaments SET status = ? WHERE id = ?', ['active', id]);
        res.json({ success: true, message: 'Torneio iniciado!' });
    } catch (error) {
        console.error('❌ Erro ao iniciar torneio:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
}));

app.delete('/api/tournaments/:id', createHandler(async (req, res) => {
    const { query } = require('./api/db');
    const { id } = req.params;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
        await query('DELETE FROM tournaments WHERE id = ?', [id]);
        res.json({ success: true, message: 'Torneio deletado!' });
    } catch (error) {
        console.error('❌ Erro ao deletar torneio:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
}));

const avatarsApi = require('./api/avatars');
app.use('/api/avatars', avatarsApi);

// Rota para servir o HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Admin Panel rodando em: http://localhost:${PORT}`);
    console.log(`📊 Acesse o painel de administração no navegador`);
    console.log(`🔑 Use a senha: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
});

module.exports = app;
