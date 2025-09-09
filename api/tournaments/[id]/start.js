const { createConnection } = require('../database');

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    let connection;
    try {
        connection = await createConnection();
        
        const tournamentId = req.url.split('/')[2]; // Pegar ID da URL
        
        // Atualizar status do torneio para "em_andamento"
        await connection.execute(
            'UPDATE tournaments SET status = "em_andamento" WHERE id = ?',
            [tournamentId]
        );

        return res.status(200).json({ 
            success: true, 
            message: 'Torneio iniciado com sucesso!' 
        });

    } catch (error) {
        console.error('Erro ao iniciar torneio:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
};
