const { createConnection } = require('./database');

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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
                    t.id,
                    t.name,
                    t.leader_id,
                    p.username as leader_name,
                    t.created_at,
                    COUNT(tm.player_id) as player_count
                FROM teams t
                LEFT JOIN players p ON t.leader_id = p.discord_id
                LEFT JOIN team_members tm ON t.id = tm.team_id
            `;
            
            let params = [];
            
            if (search) {
                query += ' WHERE t.name LIKE ?';
                params = [`%${search}%`];
            }
            
            query += ' GROUP BY t.id ORDER BY t.created_at DESC LIMIT 100';
            
            const [rows] = await connection.execute(query, params);
            
            return res.status(200).json({ success: true, data: rows });
            
        } else if (req.method === 'DELETE') {
            const teamId = req.url.split('/').pop();
            
            // Deletar membros do time primeiro
            await connection.execute('DELETE FROM team_members WHERE team_id = ?', [teamId]);
            
            // Deletar o time
            await connection.execute('DELETE FROM teams WHERE id = ?', [teamId]);
            
            return res.status(200).json({ success: true, message: 'Time excluído com sucesso' });
        }

        return res.status(405).json({ success: false, message: 'Método não permitido' });

    } catch (error) {
        console.error('Erro teams:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
};
