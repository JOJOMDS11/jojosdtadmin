const { createConnection } = require('./database');

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    let connection;
    try {
        connection = await createConnection();

        // Buscar estatísticas gerais
        const [playersCount] = await connection.execute('SELECT COUNT(*) as total FROM players');
        const [teamsCount] = await connection.execute('SELECT COUNT(*) as total FROM teams');
        const [cardsCount] = await connection.execute('SELECT COUNT(*) as total FROM player_cards');
        
        // Tentar buscar templates (pode não existir)
        let templatesCount = [{ total: 0 }];
        try {
            [templatesCount] = await connection.execute('SELECT COUNT(*) as total FROM player_templates');
        } catch (error) {
            console.log('Tabela player_templates não existe');
        }

        // Buscar total de purple coins
        const [coinsSum] = await connection.execute('SELECT SUM(purple_coins) as total FROM players');

        return res.status(200).json({
            success: true,
            data: {
                totalPlayers: playersCount[0].total,
                totalTeams: teamsCount[0].total,
                totalCards: cardsCount[0].total,
                totalTemplates: templatesCount[0].total,
                totalPurpleCoins: coinsSum[0].total || 0
            }
        });

    } catch (error) {
        console.error('Erro ao buscar stats:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    } finally {
        if (connection) await connection.end();
    }
}
