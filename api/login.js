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

    const { password } = req.body;
    
    // Senha do admin alterada para "eojojos"
    if (password === 'eojojos') {
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ success: false, message: 'Senha incorreta' });
    }
}
