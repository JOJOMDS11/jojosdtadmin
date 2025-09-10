const { query } = require('./db');

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Buscar estatísticas de purple coins
            const coinsStats = await query(`
                SELECT 
                    SUM(purple_coins) as total_coins,
                    COUNT(*) as total_players,
                    AVG(purple_coins) as avg_coins,
                    MAX(purple_coins) as max_coins
                FROM players
            `);

            // Top 10 jogadores com mais coins
            const topPlayers = await query(`
                SELECT discord_id, purple_coins
                FROM players
                ORDER BY purple_coins DESC
                LIMIT 10
            `);

            return res.status(200).json({
                success: true,
                data: {
                    stats: coinsStats[0],
                    topPlayers: topPlayers
                }
            });

        } else if (req.method === 'POST') {
            const { discord_id, amount, action } = req.body;

            if (!discord_id || !amount || !action) {
                return res.status(400).json({
                    success: false,
                    message: 'Discord ID, amount e action são obrigatórios'
                });
            }

            // Buscar jogador atual
            const player = await query(`
                SELECT purple_coins FROM players WHERE discord_id = ?
            `, [discord_id]);

            if (player.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Jogador não encontrado'
                });
            }

            let newAmount;
            if (action === 'add') {
                newAmount = player[0].purple_coins + parseInt(amount);
            } else if (action === 'remove') {
                newAmount = Math.max(0, player[0].purple_coins - parseInt(amount));
            } else if (action === 'set') {
                newAmount = parseInt(amount);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Action deve ser: add, remove ou set'
                });
            }

            // Atualizar coins do jogador
            await query(`
                UPDATE players 
                SET purple_coins = ? 
                WHERE discord_id = ?
            `, [newAmount, discord_id]);

            return res.status(200).json({
                success: true,
                message: `Purple coins ${action === 'add' ? 'adicionados' : action === 'remove' ? 'removidos' : 'definidos'} com sucesso`,
                data: {
                    discord_id,
                    old_amount: player[0].purple_coins,
                    new_amount: newAmount
                }
            });

        } else {
            return res.status(405).json({
                success: false,
                message: 'Método não permitido'
            });
        }

    } catch (error) {
        console.error('Erro na API de coins:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
}
