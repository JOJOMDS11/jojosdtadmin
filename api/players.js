const { createConnection } = require('./database');

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let connection;
    try {
        connection = await createConnection();

        if (req.method === 'GET') {
            const { search } = req.query;
            
            let query = `
                SELECT 
                    p.discord_id,
                    p.username as name,
                    p.purple_coins,
                    COUNT(pc.card_id) as card_count,
                    t.name as team_name,
                    p.created_at
                FROM players p
                LEFT JOIN player_cards pc ON p.discord_id = pc.discord_id
                LEFT JOIN teams t ON p.discord_id = t.leader_id
            `;
            
            let params = [];
            
            if (search) {
                query += ' WHERE p.discord_id LIKE ? OR p.username LIKE ?';
                params = [`%${search}%`, `%${search}%`];
            }
            
            query += ' GROUP BY p.discord_id ORDER BY p.purple_coins DESC LIMIT 100';
            
            const [rows] = await connection.execute(query, params);
            
            return res.status(200).json({ success: true, data: rows });
            
        } else if (req.method === 'POST') {
            const { discord_id, purple_coins } = req.body;
            
            if (!discord_id || purple_coins === undefined) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Discord ID e purple_coins são obrigatórios' 
                });
            }
            
            // Verificar se o jogador existe
            const [existing] = await connection.execute(
                'SELECT discord_id, purple_coins FROM players WHERE discord_id = ?',
                [discord_id]
            );
            
            if (existing.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Jogador não encontrado' 
                });
            }
            
            // Atualizar purple coins (adicionar ao valor atual)
            const currentCoins = existing[0].purple_coins || 0;
            const newCoins = currentCoins + parseInt(purple_coins);
            
            await connection.execute(
                'UPDATE players SET purple_coins = ? WHERE discord_id = ?',
                [newCoins, discord_id]
            );
            
            return res.status(200).json({ 
                success: true, 
                message: `Purple coins atualizadas! ${currentCoins} → ${newCoins}`
            });
        }

        return res.status(405).json({ success: false, message: 'Método não permitido' });

    } catch (error) {
        console.error('Erro players:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
}
