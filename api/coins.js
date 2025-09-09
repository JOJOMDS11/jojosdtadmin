const { createConnection } = require('./database');

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
        
        const { discordId, amount } = req.body;
        
        if (!discordId || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Discord ID e quantidade são obrigatórios' });
        }

        // Verificar se o jogador existe
        const [playerCheck] = await connection.execute(
            'SELECT discord_id FROM players WHERE discord_id = ?',
            [discordId]
        );

        if (playerCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Jogador não encontrado' });
        }

        // Adicionar coins
        await connection.execute(
            'UPDATE players SET purple_coins = purple_coins + ? WHERE discord_id = ?',
            [amount, discordId]
        );

        return res.status(200).json({ 
            success: true, 
            message: `${amount} Purple Coins adicionadas ao jogador ${discordId}` 
        });

    } catch (error) {
        console.error('Erro ao adicionar coins:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
};
