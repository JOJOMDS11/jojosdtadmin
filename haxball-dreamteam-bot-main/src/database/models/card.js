const { query } = require('../connection');

// Criar nova carta
const createCard = async (cardData) => {
    try {
        const sql = `
            INSERT INTO user_cards (
                discord_id, template_id, player_name, position, 
                avatar, rarity, overall_rating, source, stats,
                posicionamento, saidaDeBola, defesa, drible, passe, finalizacao,
                goals_conceded, clean_sheets, own_goals
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const stats = cardData.stats || {};
        const values = [
            cardData.discord_id,
            cardData.template_id,
            cardData.player_name,
            cardData.position,
            cardData.avatar,
            cardData.rarity,
            cardData.overall_rating,
            cardData.source || 'pack',
            JSON.stringify(stats),
            stats.posicionamento || 0,
            stats.saidaDeBola || 0,
            stats.defesa || 0,
            stats.drible || 0,
            stats.passe || 0,
            stats.finalizacao || 0,
            cardData.goals_conceded || 0,
            cardData.clean_sheets || 0,
            cardData.own_goals || 0
        ];

        const result = await query(sql, values);
        return result.insertId;
    } catch (error) {
        console.error('Erro ao criar carta:', error);
        throw error;
    }
};

// Buscar cartas por jogador
const getCardsByPlayer = async (discordId) => {
    try {
        const sql = `
            SELECT uc.*, 
                   pt.name as template_name,
                   pt.avatar as template_avatar
            FROM user_cards uc 
            LEFT JOIN player_templates pt ON uc.template_id = pt.id 
            WHERE uc.discord_id = ? 
            ORDER BY uc.overall_rating DESC, uc.created_at DESC
        `;

        const rows = await query(sql, [discordId]);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar cartas do jogador:', error);
        throw error;
    }
};

// Alias para getUserCards (compatibilidade)
const getUserCards = getCardsByPlayer;

// Contar cartas do usuário
const getUserCardCount = async (discordId) => {
    try {
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN rarity = 'Prime' THEN 1 ELSE 0 END) as prime,
                SUM(CASE WHEN rarity = 'GOAT' THEN 1 ELSE 0 END) as goat,
                SUM(CASE WHEN rarity = 'Médio' THEN 1 ELSE 0 END) as medio,
                SUM(CASE WHEN rarity = 'Bagre' THEN 1 ELSE 0 END) as bagre
            FROM user_cards 
            WHERE discord_id = ?
        `;
        const rows = await query(sql, [discordId]);
        return rows[0];
    } catch (error) {
        console.error('Erro ao contar cartas do usuário:', error);
        throw error;
    }
};

// Buscar cartas por raridade
const getCardsByRarity = async (discordId, rarity) => {
    try {
        const sql = `
            SELECT uc.*, 
                   pt.name as template_name,
                   pt.avatar as template_avatar
            FROM user_cards uc 
            LEFT JOIN player_templates pt ON uc.template_id = pt.id 
            WHERE uc.discord_id = ? AND uc.rarity = ?
            ORDER BY uc.overall_rating DESC, uc.created_at DESC
        `;

        const rows = await query(sql, [discordId, rarity]);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar cartas por raridade:', error);
        throw error;
    }
};

// Buscar cartas por nome do jogador
const getCardsByPlayerName = async (discordId, playerName) => {
    try {
        const sql = `
            SELECT uc.*, 
                   pt.name as template_name,
                   pt.avatar as template_avatar
            FROM user_cards uc 
            LEFT JOIN player_templates pt ON uc.template_id = pt.id 
            WHERE uc.discord_id = ? AND uc.player_name LIKE ?
            ORDER BY uc.overall_rating DESC, uc.created_at DESC
        `;

        const rows = await query(sql, [discordId, `%${playerName}%`]);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar cartas por nome:', error);
        throw error;
    }
};

// Deletar carta
const deleteCard = async (cardId, discordId) => {
    try {
        const sql = `
            DELETE FROM user_cards 
            WHERE id = ? AND discord_id = ?
        `;

        const result = await query(sql, [cardId, discordId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao deletar carta:', error);
        throw error;
    }
};

// Buscar carta específica
const getCardById = async (cardId, discordId) => {
    try {
        const sql = `
            SELECT uc.*, 
                   pt.name as template_name,
                   pt.avatar as template_avatar
            FROM user_cards uc 
            LEFT JOIN player_templates pt ON uc.template_id = pt.id 
            WHERE uc.id = ? AND uc.discord_id = ?
        `;

        const rows = await query(sql, [cardId, discordId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar carta por ID:', error);
        throw error;
    }
};

// Alias para compatibilidade
const getUserCardById = getCardById;

// Transferir carta entre jogadores
const transferCard = async (cardId, fromDiscordId, toDiscordId) => {
    try {
        const sql = `
            UPDATE user_cards 
            SET discord_id = ?, updated_at = NOW()
            WHERE id = ? AND discord_id = ?
        `;

        const result = await query(sql, [toDiscordId, cardId, fromDiscordId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao transferir carta:', error);
        throw error;
    }
};

// Verificar se carta pertence ao jogador
const cardBelongsToPlayer = async (cardId, discordId) => {
    try {
        const sql = `
            SELECT id FROM user_cards 
            WHERE id = ? AND discord_id = ?
        `;

        const rows = await query(sql, [cardId, discordId]);
        return rows.length > 0;
    } catch (error) {
        console.error('Erro ao verificar posse da carta:', error);
        throw error;
    }
};

// Buscar cartas por posição
const getCardsByPosition = async (discordId, position) => {
    try {
        const sql = `
            SELECT * FROM user_cards 
            WHERE discord_id = ? AND position = ?
            ORDER BY overall_rating DESC, created_at DESC
        `;

        const rows = await query(sql, [discordId, position]);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar cartas por posição:', error);
        throw error;
    }
};

// Contar cartas do jogador
const getPlayerCardCount = async (discordId) => {
    try {
        const sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN rarity = 'Bronze' THEN 1 END) as bronze,
                COUNT(CASE WHEN rarity = 'Prata' THEN 1 END) as silver,
                COUNT(CASE WHEN rarity = 'Ouro' THEN 1 END) as gold,
                COUNT(CASE WHEN rarity = 'Prime' THEN 1 END) as prime
            FROM user_cards 
            WHERE discord_id = ?
        `;

        const rows = await query(sql, [discordId]);
        return rows[0] || { total: 0, bronze: 0, silver: 0, gold: 0, prime: 0 };
    } catch (error) {
        console.error('Erro ao contar cartas:', error);
        throw error;
    }
};

// Atualizar stats da carta
const updateCardStats = async (cardId, newStats) => {
    try {
        const sql = `
            UPDATE user_cards 
            SET stats = ?, updated_at = NOW()
            WHERE id = ?
        `;

        const result = await query(sql, [JSON.stringify(newStats), cardId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao atualizar stats da carta:', error);
        throw error;
    }
};

// Buscar cartas duplicadas (mesmo template)
const getDuplicateCards = async (discordId, templateId) => {
    try {
        const sql = `
            SELECT * FROM user_cards 
            WHERE discord_id = ? AND template_id = ?
            ORDER BY overall_rating DESC
        `;

        const rows = await query(sql, [discordId, templateId]);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar cartas duplicadas:', error);
        throw error;
    }
};

module.exports = {
    createCard,
    getCardsByPlayer,
    getUserCards,
    getUserCardCount,
    getCardsByRarity,
    getCardsByPlayerName,
    deleteCard,
    getCardById,
    getUserCardById,
    transferCard,
    cardBelongsToPlayer,
    getCardsByPosition,
    getPlayerCardCount,
    updateCardStats,
    getDuplicateCards
};