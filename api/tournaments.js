const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'jojodreamteam.cgv8aga22uxg.us-east-1.rds.amazonaws.com',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'soufoda123',
    database: process.env.DB_NAME || 'jojodb',
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
                // Buscar todos os torneios
                const [rows] = await connection.execute(`
                    SELECT 
                        t.*,
                        COUNT(tr.id) as registered_teams
                    FROM tournaments t
                    LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
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
            const { 
                name, 
                date, 
                time, 
                format = '3v3', 
                max_players = 6,
                prize_1st = '100 Purple Coins',
                prize_2nd = '50 Purple Coins',
                prize_3rd = '25 Purple Coins'
            } = req.body;

            if (!name || !date || !time) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome, data e horário são obrigatórios'
                });
            }

            const [result] = await connection.execute(`
                INSERT INTO tournaments (
                    name, date, time, format, max_players, 
                    prize_1st, prize_2nd, prize_3rd, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')
            `, [name, date, time, format, max_players, prize_1st, prize_2nd, prize_3rd]);

            return res.json({
                success: true,
                message: 'Torneio criado com sucesso!',
                tournament_id: result.insertId
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

            await connection.execute(`DELETE FROM tournaments WHERE id = ?`, [id]);

            return res.json({
                success: true,
                message: 'Torneio excluído com sucesso!'
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
