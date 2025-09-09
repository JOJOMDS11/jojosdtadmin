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

        if (req.method === 'POST') {
            // Gerar novo código
            const { amount, max_uses } = req.body;

            if (!amount || !max_uses || amount <= 0 || max_uses <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Quantidade e número máximo de usos são obrigatórios' 
                });
            }

            // Gerar código único
            const code = generateUniqueCode();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // Expira em 30 dias

            await connection.execute(
                INSERT INTO purple_coin_codes (code, amount, max_uses, remaining_uses, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            , [code, amount, max_uses, max_uses, expiresAt]);

            return res.status(200).json({
                success: true,
                code: code,
                amount: amount,
                max_uses: max_uses,
                expires_at: expiresAt.toISOString()
            });

        } else if (req.method === 'GET') {
            // Listar códigos ativos
            const [codes] = await connection.execute(
                SELECT code, amount, max_uses, remaining_uses, expires_at, created_at
                FROM purple_coin_codes 
                WHERE remaining_uses > 0 AND expires_at > NOW()
                ORDER BY created_at DESC
            );

            return res.status(200).json({
                success: true,
                codes: codes
            });

        } else if (req.method === 'DELETE') {
            // Deletar código específico
            const code = req.url.split('/').pop();
            
            if (!code) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Código não especificado' 
                });
            }

            const [result] = await connection.execute(
                'DELETE FROM purple_coin_codes WHERE code = ?',
                [code]
            );

            if (result.affectedRows > 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Código deletado com sucesso'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Código não encontrado'
                });
            }
        }

    } catch (error) {
        console.error('Erro na API de códigos:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
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
