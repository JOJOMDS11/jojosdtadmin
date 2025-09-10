const connection = require('./connection');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // Buscar jogadores
        const [players] = await connection.execute(`
            SELECT 
                discord_id,
                name,
                purple_coins,
                created_at,
                position,
                avatar
            FROM players 
            ORDER BY purple_coins DESC
        `);

        return res.status(200).json({
            success: true,
            data: players
        });

    } catch (error) {
        console.error('Erro ao buscar jogadores:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar jogadores',
            details: error.message
        });
    }
};
