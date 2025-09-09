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
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'PUT') {
        return res.status(405).json({
            success: false,
            message: 'Método não permitido'
        });
    }

    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);

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
                message: 'Status inválido. Use: ATIVO, EM_ANDAMENTO, FINALIZADO ou CANCELADO'
            });
        }

        // Verificar se torneio existe
        const [existing] = await connection.execute(
            'SELECT id, status FROM tournaments WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Torneio não encontrado'
            });
        }

        // Atualizar status
        await connection.execute(
            'UPDATE tournaments SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );

        // Se finalizar torneio, distribuir prêmios (lógica adicional pode ser implementada aqui)
        if (status === 'FINALIZADO') {
            // Aqui você pode adicionar lógica para distribuir Purple Coins para o vencedor
            console.log(`Torneio ${id} finalizado. Implementar distribuição de prêmios.`);
        }

        return res.json({
            success: true,
            message: `Status do torneio atualizado para ${status}`,
            previous_status: existing[0].status,
            new_status: status
        });

    } catch (error) {
        console.error('Erro ao atualizar status do torneio:', error);
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
