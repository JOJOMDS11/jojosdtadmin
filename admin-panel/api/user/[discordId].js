const { query } = require('./db');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { discordId } = req.query;

        if (!discordId) {
            return res.status(400).json({ error: 'Discord ID é obrigatório' });
        }

        // Buscar usuário
        const user = await query('SELECT * FROM players WHERE discord_id = ?', [discordId]);

        if (user.length === 0) {
            return res.json({ success: false, error: 'Usuário não encontrado' });
        }

        // Buscar estatísticas de cartas
        const cards = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN rarity = 'Prime' THEN 1 ELSE 0 END) as prime,
        SUM(CASE WHEN rarity = 'GOAT' THEN 1 ELSE 0 END) as goat,
        SUM(CASE WHEN rarity = 'Médio' THEN 1 ELSE 0 END) as medio,
        SUM(CASE WHEN rarity = 'Bagre' THEN 1 ELSE 0 END) as bagre
      FROM user_cards 
      WHERE discord_id = ?
    `, [discordId]);

        res.json({
            success: true,
            user: user[0],
            cards: cards[0]
        });

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
