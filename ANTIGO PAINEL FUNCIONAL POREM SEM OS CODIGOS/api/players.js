const { query } = require('./db');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Buscar jogadores com informações de suas cartas e times
        const players = await query(`
            SELECT 
                p.discord_id,
                p.username,
                p.purple_coins,
                p.created_at,
                COUNT(uc.id) as total_cards,
                SUM(CASE WHEN uc.rarity = 'Prime' THEN 1 ELSE 0 END) as prime_cards,
                SUM(CASE WHEN uc.rarity = 'GOAT' THEN 1 ELSE 0 END) as goat_cards,
                SUM(CASE WHEN uc.rarity = 'Médio' THEN 1 ELSE 0 END) as medio_cards,
                SUM(CASE WHEN uc.rarity = 'Bagre' THEN 1 ELSE 0 END) as bagre_cards,
                t.name as team_name,
                t.wins,
                t.losses,
                t.draws,
                t.points
            FROM players p
            LEFT JOIN user_cards uc ON p.discord_id = uc.discord_id
            LEFT JOIN teams t ON p.discord_id = t.owner_discord_id
            GROUP BY p.discord_id, p.username, p.purple_coins, p.created_at, 
                     t.name, t.wins, t.losses, t.draws, t.points
            ORDER BY p.purple_coins DESC, total_cards DESC
        `);

        // Processar dados e incluir avatar dos usuários
        const processedPlayers = players.map(player => ({
            discord_id: player.discord_id,
            username: player.username,
            purple_coins: player.purple_coins || 0,
            total_cards: player.total_cards || 0,
            prime_cards: player.prime_cards || 0,
            goat_cards: player.goat_cards || 0,
            medio_cards: player.medio_cards || 0,
            bagre_cards: player.bagre_cards || 0,
            team_name: player.team_name || 'Sem time',
            team_stats: {
                wins: player.wins || 0,
                losses: player.losses || 0,
                draws: player.draws || 0,
                points: player.points || 0
            },
            created_at: player.created_at
        }));

        res.json(processedPlayers);

    } catch (error) {
        console.error('Erro ao buscar jogadores:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
}
