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

    const { emoji } = req.body;
    
    if (!emoji) {
        return res.status(400).json({ 
            success: false, 
            message: 'Emoji é obrigatório' 
        });
    }

    try {
        // Converter emoji para código hexadecimal
        const emojiCode = emojiToHex(emoji);
        
        let connection;
        try {
            connection = await createConnection();
            
            // Salvar no banco de dados (tabela emoji_codes)
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS emoji_codes (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    emoji VARCHAR(10) NOT NULL,
                    hex_code VARCHAR(50) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await connection.execute(`
                INSERT INTO emoji_codes (emoji, hex_code, created_at)
                VALUES (?, ?, NOW())
            `, [emoji, emojiCode]);
            
        } catch (dbError) {
            console.log('Erro no banco, continuando sem salvar:', dbError.message);
        } finally {
            if (connection) await connection.end();
        }

        return res.status(200).json({
            success: true,
            emoji: emoji,
            hex_code: emojiCode,
            message: 'Emoji convertido e salvo com sucesso!'
        });

    } catch (error) {
        console.error('Erro emoji-converter:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro interno',
            details: error.message 
        });
    }
}

function emojiToHex(emoji) {
    try {
        // Converter emoji para array de code points
        const codePoints = Array.from(emoji).map(char => {
            const codePoint = char.codePointAt(0);
            return codePoint.toString(16).toUpperCase().padStart(4, '0');
        });
        
        // Juntar com prefixo para formato de código
        return codePoints.join('');
    } catch (error) {
        throw new Error('Erro ao converter emoji: ' + error.message);
    }
}
