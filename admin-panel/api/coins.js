const connection = require('./connection');
const mysql = require('mysql2/promise');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Buscar códigos Purple Coins da database jojopix
            const codeConnection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: 'jojopix',
                port: process.env.DB_PORT || 3306
            });

            const [codes] = await codeConnection.execute(`
                SELECT 
                    id,
                    code,
                    purple_coins_value,
                    used_by_discord_id,
                    used_at,
                    created_at,
                    expires_at,
                    created_by,
                    description,
                    CASE 
                        WHEN used_by_discord_id IS NOT NULL THEN 'usado'
                        WHEN expires_at < NOW() THEN 'expirado'
                        ELSE 'ativo'
                    END as status
                FROM purple_coin_codes 
                ORDER BY created_at DESC
            `);

            await codeConnection.end();

            return res.status(200).json({
                success: true,
                codes: codes
            });

        } else if (req.method === 'POST') {
            const { code, purple_coins_value, expires_at, description } = req.body;

            if (!code || !purple_coins_value) {
                return res.status(400).json({
                    success: false,
                    message: 'Código e valor são obrigatórios'
                });
            }

            // Conectar à database jojopix para códigos
            const codeConnection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: 'jojopix',
                port: process.env.DB_PORT || 3306
            });

            // Verificar se o código já existe
            const [existing] = await codeConnection.execute(
                'SELECT id FROM purple_coin_codes WHERE code = ?',
                [code]
            );

            if (existing.length > 0) {
                await codeConnection.end();
                return res.status(400).json({
                    success: false,
                    message: 'Este código já existe'
                });
            }

            // Criar o código
            await codeConnection.execute(`
                INSERT INTO purple_coin_codes (code, purple_coins_value, expires_at, created_by, description)
                VALUES (?, ?, ?, 'ADMIN_PANEL', ?)
            `, [code, purple_coins_value, expires_at || null, description || null]);

            await codeConnection.end();

            return res.status(200).json({
                success: true,
                message: 'Código criado com sucesso!'
            });

        } else if (req.method === 'DELETE') {
            // Extrair ID da URL
            const url = req.url || '';
            const match = url.match(/\/api\/codes\/(\d+)/);
            if (!match) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do código não fornecido'
                });
            }

            const codeId = match[1];

            // Conectar à database jojopix para códigos
            const codeConnection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: 'jojopix',
                port: process.env.DB_PORT || 3306
            });

            await codeConnection.execute('DELETE FROM purple_coin_codes WHERE id = ?', [codeId]);
            await codeConnection.end();

            return res.status(200).json({
                success: true,
                message: 'Código excluído com sucesso!'
            });
        }

    } catch (error) {
        console.error('Erro na API de códigos:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor',
            details: error.message 
        });
    }
};
