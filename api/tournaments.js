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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);

        if (req.method === 'GET') {
            const { id } = req.query;

            if (id) {
                // Buscar torneio específico
                const [rows] = await connection.execute(
                    `SELECT * FROM tournaments WHERE id = ?`,
                    [id]
                );

                if (rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Torneio não encontrado'
                    });
                }

                return res.json({
                    success: true,
                    tournament: rows[0]
                });
            } else {
                // Buscar todos os torneios com contagem de times
                const [rows] = await connection.execute(`
                    SELECT 
                        t.*,
                        COUNT(tt.team_id) as registered_teams
                    FROM tournaments t
                    LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
                    GROUP BY t.id
                    ORDER BY t.created_at DESC
                `);

                return res.json({
                    success: true,
                    tournaments: rows
                });
            }
        }

        if (req.method === 'POST') {
            const { name, max_teams, prize_purple_coins, description } = req.body;

            if (!name || !max_teams) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome e número máximo de times são obrigatórios'
                });
            }

            const [result] = await connection.execute(
                `INSERT INTO tournaments (name, max_teams, prize_purple_coins, description, status, created_at) 
                 VALUES (?, ?, ?, ?, 'ATIVO', NOW())`,
                [name, max_teams, prize_purple_coins || 0, description || '']
            );

            return res.json({
                success: true,
                message: 'Torneio criado com sucesso!',
                tournament_id: result.insertId
            });
        }

        if (req.method === 'PUT') {
            // Atualizar status do torneio
            const { id, status } = req.body;

            if (!id || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'ID e status são obrigatórios'
                });
            }

            const validStatuses = ['ATIVO', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status inválido'
                });
            }

            await connection.execute(
                `UPDATE tournaments SET status = ?, updated_at = NOW() WHERE id = ?`,
                [status, id]
            );

            return res.json({
                success: true,
                message: `Status do torneio atualizado para ${status}`
            });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do torneio é obrigatório'
                });
            }

            // Verificar se existe torneio
            const [existing] = await connection.execute(
                'SELECT id FROM tournaments WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Torneio não encontrado'
                });
            }

            // Remover times inscritos primeiro
            await connection.execute(
                'DELETE FROM tournament_teams WHERE tournament_id = ?',
                [id]
            );

            // Remover torneio
            await connection.execute(
                'DELETE FROM tournaments WHERE id = ?',
                [id]
            );

            return res.json({
                success: true,
                message: 'Torneio excluído com sucesso'
            });
        }

        return res.status(405).json({
            success: false,
            message: 'Método não permitido'
        });

    } catch (error) {
        console.error('Erro na API de torneios:', error);
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
