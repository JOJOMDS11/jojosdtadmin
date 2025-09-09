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
            // Buscar códigos de purple coins
            try {
                const [codes] = await connection.execute(`
                    SELECT 
                        id,
                        code,
                        purple_coins_value,
                        used_by_discord_id,
                        used_at,
                        created_at,
                        expires_at
                    FROM purple_coin_codes 
                    ORDER BY created_at DESC 
                    LIMIT 100
                `);
                return res.status(200).json(codes);
            } catch (error) {
                // Tabela não existe, criar automaticamente
                await connection.execute(`
                    CREATE TABLE IF NOT EXISTS purple_coin_codes (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        code VARCHAR(50) UNIQUE NOT NULL,
                        purple_coins_value INT NOT NULL DEFAULT 100,
                        used_by_discord_id VARCHAR(50) NULL,
                        used_at DATETIME NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        expires_at DATETIME NULL,
                        INDEX idx_code (code),
                        INDEX idx_used (used_by_discord_id)
                    )
                `);
                return res.status(200).json([]);
            }
            
        } else if (req.method === 'POST') {
            const { action, code, purple_coins_value } = req.body;
            
            if (action === 'create') {
                // Criar novo código
                const generatedCode = code || generateRandomCode();
                const coinsValue = purple_coins_value || 100;
                
                await connection.execute(`
                    INSERT INTO purple_coin_codes (code, purple_coins_value, created_at)
                    VALUES (?, ?, NOW())
                `, [generatedCode, coinsValue]);
                
                return res.status(200).json({ 
                    success: true, 
                    message: `Código ${generatedCode} criado com ${coinsValue} Purple Coins!`,
                    code: generatedCode
                });
                
            } else if (action === 'use') {
                const { discord_id } = req.body;
                
                if (!code || !discord_id) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Código e Discord ID são obrigatórios' 
                    });
                }
                
                // Verificar se código existe e não foi usado
                const [codeData] = await connection.execute(`
                    SELECT id, purple_coins_value, used_by_discord_id, expires_at
                    FROM purple_coin_codes 
                    WHERE code = ?
                `, [code]);
                
                if (codeData.length === 0) {
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Código não encontrado!' 
                    });
                }
                
                const codeInfo = codeData[0];
                
                if (codeInfo.used_by_discord_id) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Código já foi utilizado!' 
                    });
                }
                
                if (codeInfo.expires_at && new Date() > new Date(codeInfo.expires_at)) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Código expirado!' 
                    });
                }
                
                // Marcar código como usado
                await connection.execute(`
                    UPDATE purple_coin_codes 
                    SET used_by_discord_id = ?, used_at = NOW()
                    WHERE code = ?
                `, [discord_id, code]);
                
                // Adicionar purple coins ao jogador
                await connection.execute(`
                    UPDATE players 
                    SET purple_coins = purple_coins + ?
                    WHERE discord_id = ?
                `, [codeInfo.purple_coins_value, discord_id]);
                
                return res.status(200).json({ 
                    success: true, 
                    message: `Código resgatado! ${codeInfo.purple_coins_value} Purple Coins adicionadas!`,
                    purple_coins_added: codeInfo.purple_coins_value
                });
            }
            
        } else if (req.method === 'DELETE') {
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID é obrigatório' 
                });
            }
            
            await connection.execute('DELETE FROM purple_coin_codes WHERE id = ?', [id]);
            
            return res.status(200).json({ 
                success: true, 
                message: 'Código excluído com sucesso!' 
            });
        }

        return res.status(405).json({ success: false, message: 'Método não permitido' });

    } catch (error) {
        console.error('Erro purple-coins:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
}

function generateRandomCode() {
    return 'PC' + Math.random().toString(36).substr(2, 8).toUpperCase();
}
