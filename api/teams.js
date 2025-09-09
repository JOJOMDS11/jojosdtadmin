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
            const [rows] = await connection.execute(`
                SELECT 
                    id,
                    name,
                    owner_discord_id,
                    gk_card_id,
                    vl_card_id,
                    pv_card_id,
                    wins,
                    losses,
                    goals_for,
                    goals_against,
                    created_at
                FROM teams
                ORDER BY wins DESC
                LIMIT 100
            `);
            
            return res.status(200).json(rows);
        }

        return res.status(405).json({ success: false, message: 'Método não permitido' });

    } catch (error) {
        console.error('Erro teams:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
}
