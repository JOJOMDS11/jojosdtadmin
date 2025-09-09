const { createConnection } = require('../database');

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    let connection;
    try {
        connection = await createConnection();
        
        const discordId = req.url.split('/').pop();
        
        // Buscar dados do usuário
        const [userRows] = await connection.execute(`
            SELECT 
                p.discord_id,
                p.username as name,
                p.purple_coins,
                t.name as team_name
            FROM players p
            LEFT JOIN teams t ON p.discord_id = t.leader_id
            WHERE p.discord_id = ?
        `, [discordId]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        // Buscar cartas do usuário
        const [cardRows] = await connection.execute(`
            SELECT 
                pt.name,
                pt.position,
                pc.rarity
            FROM player_cards pc
            JOIN player_templates pt ON pc.card_id = pt.id
            WHERE pc.discord_id = ?
        `, [discordId]);

        return res.status(200).json({ 
            success: true, 
            user: userRows[0],
            cards: cardRows
        });

    } catch (error) {
        console.error('Erro na busca de usuário:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
};
