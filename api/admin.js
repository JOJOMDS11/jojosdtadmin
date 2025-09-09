// Handler unificado para rotas administrativas do painel
const { createConnection } = require('./database');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let connection;
  try {
    connection = await createConnection();
    const url = req.url.split('?')[0];

    // Rotas times
    if (url === '/teams') {
      if (req.method === 'GET') {
        const [rows] = await connection.execute('SELECT * FROM teams ORDER BY created_at DESC LIMIT 100');
        return res.status(200).json({ success: true, data: rows });
      }
      // ...adicionar POST/DELETE se necessário
    }

    // Rotas jogadores
    if (url === '/players') {
      if (req.method === 'GET') {
        const [rows] = await connection.execute('SELECT * FROM players ORDER BY purple_coins DESC LIMIT 100');
        return res.status(200).json({ success: true, data: rows });
      }
    }

    // Rotas templates
    if (url === '/templates') {
      if (req.method === 'GET') {
        const [rows] = await connection.execute('SELECT * FROM player_templates ORDER BY created_at DESC LIMIT 50');
        return res.status(200).json({ success: true, data: rows });
      }
    }

    // Rotas torneios
    if (url === '/tournaments') {
      if (req.method === 'GET') {
        const [rows] = await connection.execute('SELECT * FROM tournaments ORDER BY created_at DESC');
        return res.status(200).json({ success: true, tournaments: rows });
      }
    }

    // Rotas stats
    if (url === '/stats') {
      if (req.method === 'GET') {
        const [playersCount] = await connection.execute('SELECT COUNT(*) as total FROM players');
        const [teamsCount] = await connection.execute('SELECT COUNT(*) as total FROM teams');
        const [cardsCount] = await connection.execute('SELECT COUNT(*) as total FROM player_cards');
        const [templatesCount] = await connection.execute('SELECT COUNT(*) as total FROM player_templates');
        return res.status(200).json({
          success: true,
          data: {
            totalPlayers: playersCount[0].total,
            totalTeams: teamsCount[0].total,
            totalCards: cardsCount[0].total,
            totalTemplates: templatesCount[0].total
          }
        });
      }
    }

    // Rotas codes (códigos de Purple Coins)
    if (url === '/codes') {
      if (req.method === 'GET') {
        const [codes] = await connection.execute('SELECT * FROM purple_coin_codes ORDER BY created_at DESC');
        return res.status(200).json({ success: true, codes });
      }
      if (req.method === 'DELETE') {
        const code = req.query.code || req.url.split('/').pop();
        await connection.execute('DELETE FROM purple_coin_codes WHERE code = ?', [code]);
        return res.status(200).json({ success: true, message: 'Código excluído com sucesso' });
      }
    }

    // Rotas user
    if (url.startsWith('/user/')) {
      const discordId = url.split('/').pop();
      const [user] = await connection.execute('SELECT * FROM players WHERE discord_id = ?', [discordId]);
      if (!user.length) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      const [cards] = await connection.execute('SELECT COUNT(*) as total FROM player_cards WHERE discord_id = ?', [discordId]);
      return res.status(200).json({ success: true, user: user[0], cards: cards[0] });
    }

    // Default
    return res.status(404).json({ success: false, message: 'Rota não encontrada' });
  } catch (error) {
    console.error('Erro no handler unificado:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  } finally {
    if (connection) await connection.end();
  }
};
