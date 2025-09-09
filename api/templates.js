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
            // Tentar buscar templates
            try {
                const [rows] = await connection.execute(`
                    SELECT id, name, position, avatar, created_at 
                    FROM player_templates 
                    ORDER BY created_at DESC 
                    LIMIT 50
                `);
                return res.status(200).json({ success: true, data: rows });
            } catch (error) {
                console.log('Tabela player_templates não existe');
                return res.status(200).json({ success: true, data: [] });
            }
            
        } else if (req.method === 'POST') {
            const { name, position, avatar } = req.body;
            
            if (!name || !position) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Nome e posição são obrigatórios' 
                });
            }
            
            // Criar template
            await connection.execute(`
                INSERT INTO player_templates (name, position, avatar, created_at)
                VALUES (?, ?, ?, NOW())
            `, [name, position, avatar || null]);
            
            return res.status(200).json({ 
                success: true, 
                message: 'Template criado com sucesso!' 
            });
            
        } else if (req.method === 'DELETE') {
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID é obrigatório' 
                });
            }
            
            await connection.execute('DELETE FROM player_templates WHERE id = ?', [id]);
            
            return res.status(200).json({ 
                success: true, 
                message: 'Template excluído com sucesso!' 
            });
        }

        return res.status(405).json({ success: false, message: 'Método não permitido' });

    } catch (error) {
        console.error('Erro templates:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
}
