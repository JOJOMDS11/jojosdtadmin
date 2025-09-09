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

        // Rotas de códigos dentro de coins
        if (req.url.startsWith('/coins/codes')) {
            if (req.method === 'GET') {
                const [codes] = await connection.execute('SELECT * FROM purple_coin_codes ORDER BY created_at DESC');
                return res.status(200).json({ success: true, codes });
            }
            if (req.method === 'DELETE') {
                const code = req.query.code || req.url.split('/').pop();
                await connection.execute('DELETE FROM purple_coin_codes WHERE code = ?', [code]);
                return res.status(200).json({ success: true, message: 'Código excluído com sucesso' });
            }
            if (req.method === 'POST') {
                // Gerar novo código
                const { amount, max_uses } = req.body;
                if (!amount || !max_uses || amount <= 0 || max_uses <= 0) {
                    return res.status(400).json({ success: false, message: 'Quantidade e número máximo de usos são obrigatórios' });
                }
                const code = generateUniqueCode();
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30); // Expira em 30 dias
                await connection.execute(
                    'INSERT INTO purple_coin_codes (code, amount, max_uses, remaining_uses, expires_at, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                    [code, amount, max_uses, max_uses, expiresAt]
                );
                return res.status(200).json({ success: true, code, amount, max_uses, expires_at: expiresAt.toISOString() });
            }
        }
        // Rota padrão - adicionar coins diretamente
        if (req.url.startsWith('/coins')) {
            // Rota padr�o - adicionar coins diretamente
            if (req.method !== 'POST') {
                return res.status(405).json({ success: false, message: 'M�todo n�o permitido' });
            }

            const { discordId, amount } = req.body;

            if (!discordId || !amount || amount <= 0) {
                return res.status(400).json({ success: false, message: 'Discord ID e quantidade s�o obrigat�rios' });
            }

            // Verificar se o jogador existe
            const [playerCheck] = await connection.execute(
                'SELECT discord_id FROM players WHERE discord_id = ?',
                [discordId]
            );

            if (playerCheck.length === 0) {
                return res.status(404).json({ success: false, message: 'Jogador n�o encontrado' });
            }

            // Adicionar coins
            await connection.execute(
                'UPDATE players SET purple_coins = purple_coins + ? WHERE discord_id = ?',
                [amount, discordId]
            );

            return res.status(200).json({
                success: true,
                message: `${amount} Purple Coins adicionadas ao jogador`
            });
        }

    } catch (error) {
        console.error('Erro na API de coins:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
}

function generateUniqueCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
