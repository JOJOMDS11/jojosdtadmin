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
        
        const { name } = req.query;
        
        if (!name) {
            return res.status(400).json({ success: false, message: 'Nome do time é obrigatório' });
        }

        const [rows] = await connection.execute(`
            SELECT 
                t.id,
                t.name,
                t.leader_id,
                p.username as leader_name,
                t.created_at
            FROM teams t
            LEFT JOIN players p ON t.leader_id = p.discord_id
            WHERE t.name LIKE ?
            LIMIT 1
        `, [`%${name}%`]);

        if (rows.length > 0) {
            return res.status(200).json({ success: true, data: rows[0] });
        } else {
            return res.status(404).json({ success: false, message: 'Time não encontrado' });
        }

    } catch (error) {
        console.error('Erro na busca de time:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
};
