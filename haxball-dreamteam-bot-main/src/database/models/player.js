const { query } = require('../connection');

// Buscar jogador por Discord ID
const getPlayerByDiscordId = async (discordId) => {
    try {
        const sql = `
            SELECT * FROM players 
            WHERE discord_id = ?
        `;

        const rows = await query(sql, [discordId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar jogador:', error);
        throw error;
    }
};

// Criar novo jogador
const createPlayer = async (playerData) => {
    try {
        const sql = `
            INSERT INTO players (
                discord_id, 
                name,
                purple_coins
            ) VALUES (?, ?, ?)
        `;

        const values = [
            playerData.discord_id,
            playerData.name || '',
            playerData.purple_coins || 0
        ];

        const result = await query(sql, values);
        return result.insertId;
    } catch (error) {
        console.error('Erro ao criar jogador:', error);
        throw error;
    }
};

// Atualizar jogador
const updatePlayer = async (discordId, updateData) => {
    try {
        const fields = [];
        const values = [];

        // Campos que podem ser atualizados
        const allowedFields = [
            'username', 'level', 'experience',
            'purple_coins', 'last_pack', 'pack_count'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        });

        if (fields.length === 0) {
            return false;
        }

        values.push(discordId);

        const sql = `
            UPDATE players 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE discord_id = ?
        `;

        const result = await query(sql, values);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao atualizar jogador:', error);
        throw error;
    }
};

// Atualizar experiência e nível
const updatePlayerXP = async (discordId, xpGain) => {
    try {
        const player = await getPlayerByDiscordId(discordId);
        if (!player) return false;

        const newXP = player.experience + xpGain;
        const newLevel = Math.floor(newXP / 100) + 1; // 100 XP por nível

        const sql = `
            UPDATE players 
            SET experience = ?, level = ?, updated_at = NOW()
            WHERE discord_id = ?
        `;

        const result = await query(sql, [newXP, newLevel, discordId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao atualizar XP:', error);
        throw error;
    }
};

// Deletar jogador
const deletePlayer = async (discordId) => {
    try {
        const sql = 'DELETE FROM players WHERE discord_id = ?';
        const result = await query(sql, [discordId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao deletar jogador:', error);
        throw error;
    }
};

// Listar todos os jogadores
const getAllPlayers = async () => {
    try {
        const sql = `
            SELECT * FROM players 
            ORDER BY level DESC, experience DESC
        `;

        const rows = await query(sql);
        return rows;
    } catch (error) {
        console.error('Erro ao listar jogadores:', error);
        throw error;
    }
};

// Atualizar time do jogador
const updatePlayerTeam = async (discordId, teamName) => {
    try {
        const sql = `
            UPDATE players 
            SET team_name = ?, updated_at = NOW()
            WHERE discord_id = ?
        `;

        const result = await query(sql, [teamName, discordId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao atualizar time do jogador:', error);
        throw error;
    }
};

// Adicionar moedas roxas
const addPurpleCoins = async (discordId, amount) => {
    try {
        const sql = `
            UPDATE players 
            SET purple_coins = purple_coins + ?, updated_at = NOW()
            WHERE discord_id = ?
        `;

        const result = await query(sql, [amount, discordId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao adicionar moedas roxas:', error);
        throw error;
    }
};

// Remover moedas roxas
const removePurpleCoins = async (discordId, amount) => {
    try {
        const sql = `
            UPDATE players 
            SET purple_coins = GREATEST(purple_coins - ?, 0), updated_at = NOW()
            WHERE discord_id = ?
        `;

        const result = await query(sql, [amount, discordId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao remover moedas roxas:', error);
        throw error;
    }
};

// Definir valor específico de moedas roxas
const updatePlayerPurpleCoins = async (discordId, amount) => {
    try {
        const sql = `
            UPDATE players 
            SET purple_coins = ?, updated_at = NOW()
            WHERE discord_id = ?
        `;

        const result = await query(sql, [amount, discordId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao atualizar moedas roxas:', error);
        throw error;
    }
};

// Atualizar contador de pacotes
const updatePackCount = async (discordId) => {
    try {
        const sql = `
            UPDATE players 
            SET pack_count = pack_count + 1, last_pack = NOW(), updated_at = NOW()
            WHERE discord_id = ?
        `;

        const result = await query(sql, [discordId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao atualizar contador de pacotes:', error);
        throw error;
    }
};

// Verificar se jogador existe
const playerExists = async (discordId) => {
    try {
        const sql = 'SELECT id FROM players WHERE discord_id = ?';
        const rows = await query(sql, [discordId]);
        return rows.length > 0;
    } catch (error) {
        console.error('Erro ao verificar jogador:', error);
        throw error;
    }
};

// Buscar top jogadores por nível
const getTopPlayersByLevel = async (limit = 10) => {
    try {
        const sql = `
            SELECT discord_id, username, level, experience, purple_coins
            FROM players 
            ORDER BY level DESC, experience DESC 
            LIMIT ?
        `;

        const rows = await query(sql, [limit]);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar top jogadores:', error);
        throw error;
    }
};

// Buscar jogadores com estatísticas completas (para API local)
const getPlayersWithStats = async () => {
    try {
        const sql = `
            SELECT 
                p.id,
                p.discord_id,
                p.username,
                p.level,
                p.experience,
                p.purple_coins,
                p.pack_count,
                p.team_name,
                p.created_at,
                p.updated_at,
                t.team_name as team_display_name,
                t.owner_username,
                COUNT(CASE WHEN uc.rarity = 'Bagre' THEN 1 END) as bagre_cards,
                COUNT(CASE WHEN uc.rarity = 'Médio' THEN 1 END) as medio_cards,
                COUNT(CASE WHEN uc.rarity = 'GOAT' THEN 1 END) as goat_cards,
                COUNT(CASE WHEN uc.rarity = 'Prime' THEN 1 END) as prime_cards,
                COUNT(uc.id) as total_cards
            FROM players p
            LEFT JOIN teams t ON p.team_name = t.team_name
            LEFT JOIN user_cards uc ON p.discord_id = uc.discord_id
            GROUP BY p.id, p.discord_id, p.username, p.level, p.experience, 
                     p.purple_coins, p.pack_count, p.team_name, p.created_at, 
                     p.updated_at, t.team_name, t.owner_username
            ORDER BY p.level DESC, p.experience DESC
        `;

        const rows = await query(sql);
        return rows.map(row => ({
            id: row.id,
            discord_id: row.discord_id,
            username: row.username,
            level: row.level,
            experience: row.experience,
            purple_coins: row.purple_coins,
            pack_count: row.pack_count,
            team_name: row.team_name,
            created_at: row.created_at,
            updated_at: row.updated_at,
            team_stats: {
                team_display_name: row.team_display_name,
                owner_username: row.owner_username,
                bagre_cards: row.bagre_cards || 0,
                medio_cards: row.medio_cards || 0,
                goat_cards: row.goat_cards || 0,
                prime_cards: row.prime_cards || 0,
                total_cards: row.total_cards || 0
            }
        }));
    } catch (error) {
        console.error('Erro ao buscar jogadores com stats:', error);
        throw error;
    }
};

module.exports = {
    getPlayerByDiscordId,
    createPlayer,
    updatePlayer,
    updatePlayerXP,
    deletePlayer,
    getAllPlayers,
    updatePlayerTeam,
    addPurpleCoins,
    removePurpleCoins,
    updatePlayerPurpleCoins,
    updatePackCount,
    playerExists,
    getTopPlayersByLevel,
    getPlayersWithStats
};
