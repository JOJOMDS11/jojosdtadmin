const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'haxball_dreamteam',
    port: process.env.DB_PORT || 3306
};

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);

        if (req.method === 'GET') {
            const { tournament_id } = req.query;

            if (!tournament_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do torneio é obrigatório'
                });
            }

            // Buscar times inscritos no torneio
            const [rows] = await connection.execute(`
                SELECT 
                    tt.*,
                    t.name as team_name,
                    p.name as leader_name,
                    (SELECT COUNT(*) FROM team_players tp WHERE tp.team_id = tt.team_id) as player_count
                FROM tournament_teams tt
                JOIN teams t ON tt.team_id = t.id
                LEFT JOIN players p ON t.leader_id = p.discord_id
                WHERE tt.tournament_id = ?
                ORDER BY tt.registered_at ASC
            `, [tournament_id]);

            return res.json({
                success: true,
                teams: rows
            });
        }

        if (req.method === 'DELETE') {
            const { team_id, tournament_id } = req.query;

            if (!team_id || !tournament_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do time e do torneio são obrigatórios'
                });
            }

            // Remover time do torneio
            const [result] = await connection.execute(
                'DELETE FROM tournament_teams WHERE team_id = ? AND tournament_id = ?',
                [team_id, tournament_id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Time não encontrado no torneio'
                });
            }

            return res.json({
                success: true,
                message: 'Time removido do torneio com sucesso'
            });
        }

        return res.status(405).json({
            success: false,
            message: 'Método não permitido'
        });

    } catch (error) {
        console.error('Erro na API de teams do torneio:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
