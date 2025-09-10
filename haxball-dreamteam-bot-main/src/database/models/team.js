const { query } = require('../connection');

// Criar novo time
const createTeam = async (teamData) => {
    try {
        // Montar query dinamicamente baseado nos campos disponíveis
        const fields = ['name', 'owner_discord_id', 'gk_card_id', 'vl_card_id', 'pv_card_id'];
        const values = [
            teamData.name,
            teamData.owner_discord_id,
            teamData.gk_card_id || null,
            teamData.vl_card_id || null,
            teamData.pv_card_id || null
        ];

        // Adicionar campos opcionais se fornecidos
        if (teamData.owner_username) {
            fields.push('owner_username');
            values.push(teamData.owner_username);
        }

        if (teamData.discord_user) {
            fields.push('discord_user');
            values.push(teamData.discord_user);
        }

        const placeholders = values.map(() => '?').join(', ');
        const sql = `INSERT INTO teams (${fields.join(', ')}) VALUES (${placeholders})`;

        const result = await query(sql, values);
        return result.insertId;
    } catch (error) {
        console.error('Erro ao criar time:', error);
        throw error;
    }
};

// Buscar time por ID
const getTeamById = async (teamId) => {
    try {
        const sql = 'SELECT * FROM teams WHERE id = ?';
        const rows = await query(sql, [teamId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar time por ID:', error);
        throw error;
    }
};

// Buscar time por nome
const getTeamByName = async (teamName) => {
    try {
        const sql = 'SELECT * FROM teams WHERE LOWER(name) = LOWER(?)';
        const rows = await query(sql, [teamName]);
        return rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar time por nome:', error);
        throw error;
    }
};

// Buscar time por dono
const getTeamByOwner = async (ownerDiscordId) => {
    try {
        const sql = 'SELECT * FROM teams WHERE owner_discord_id = ?';
        const rows = await query(sql, [ownerDiscordId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar time por dono:', error);
        throw error;
    }
};

// Atualizar escalação do time
const updateTeamLineup = async (teamId, lineup) => {
    try {
        const sql = `
            UPDATE teams 
            SET gk_card_id = ?, vl_card_id = ?, pv_card_id = ?, updated_at = NOW()
            WHERE id = ?
        `;

        const values = [
            lineup.gk_card_id,
            lineup.vl_card_id,
            lineup.pv_card_id,
            teamId
        ];

        const result = await query(sql, values);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao atualizar escalação:', error);
        throw error;
    }
};

// Atualizar estatísticas do time
const updateTeamStats = async (teamId, stats) => {
    try {
        const sql = `
            UPDATE teams 
            SET wins = ?, losses = ?, goals_for = ?, goals_against = ?
            WHERE id = ?
        `;

        const values = [
            stats.wins,
            stats.losses,
            stats.goals_for,
            stats.goals_against,
            teamId
        ];

        const result = await query(sql, values);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        throw error;
    }
};

// Deletar time
const deleteTeam = async (teamId) => {
    try {
        const sql = 'DELETE FROM teams WHERE id = ?';
        const result = await query(sql, [teamId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao deletar time:', error);
        throw error;
    }
};

// Listar todos os times
const getAllTeams = async () => {
    try {
        const sql = `
            SELECT t.*, 
                   p.username as owner_username,
                   p.purple_coins
            FROM teams t
            LEFT JOIN players p ON t.owner_discord_id = p.discord_id
            ORDER BY t.created_at DESC
        `;

        const rows = await query(sql);
        return rows;
    } catch (error) {
        console.error('Erro ao listar times:', error);
        throw error;
    }
};

// Buscar times com escalação completa
const getTeamsWithFullLineup = async () => {
    try {
        const sql = `
            SELECT * FROM teams 
            WHERE gk_card_id IS NOT NULL 
                AND vl_card_id IS NOT NULL 
                AND pv_card_id IS NOT NULL
            ORDER BY created_at DESC
        `;

        const rows = await query(sql);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar times com escalação completa:', error);
        throw error;
    }
};

// Atualizar dados do time
const updateTeam = async (teamId, updateData) => {
    try {
        const fields = [];
        const values = [];

        // Campos que podem ser atualizados (só campos que existem na tabela)
        const allowedFields = ['name', 'gk_card_id', 'vl_card_id', 'pv_card_id', 'wins', 'losses', 'goals_for', 'goals_against'];

        for (const field of allowedFields) {
            if (updateData.hasOwnProperty(field)) {
                fields.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        }

        if (fields.length === 0) {
            return false; // Nada para atualizar
        }

        values.push(teamId); // Para a cláusula WHERE

        const sql = `UPDATE teams SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
        const result = await query(sql, values);

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao atualizar time:', error);
        throw error;
    }
};

// Verificar se time existe
const teamExists = async (teamName) => {
    try {
        const sql = 'SELECT id FROM teams WHERE LOWER(name) = LOWER(?)';
        const rows = await query(sql, [teamName]);
        return rows.length > 0;
    } catch (error) {
        console.error('Erro ao verificar existência do time:', error);
        throw error;
    }
};

// Buscar times com estatísticas completas (para API local)
const getTeamsWithStats = async () => {
    try {
        const sql = `
            SELECT 
                t.id,
                t.name as team_name,
                t.owner_discord_id,
                t.owner_username,
                t.discord_user,
                t.gk_card_id,
                t.vl_card_id,
                t.pv_card_id,
                t.wins,
                t.losses,
                t.goals_for,
                t.goals_against,
                t.created_at,
                t.updated_at,
                p.username as owner_display_name,
                p.level as owner_level,
                p.purple_coins as owner_coins,
                COUNT(CASE WHEN uc.rarity = 'Bagre' THEN 1 END) as bagre_cards,
                COUNT(CASE WHEN uc.rarity = 'Médio' THEN 1 END) as medio_cards,
                COUNT(CASE WHEN uc.rarity = 'GOAT' THEN 1 END) as goat_cards,
                COUNT(CASE WHEN uc.rarity = 'Prime' THEN 1 END) as prime_cards,
                COUNT(uc.id) as total_cards
            FROM teams t
            LEFT JOIN players p ON t.owner_discord_id = p.discord_id
            LEFT JOIN user_cards uc ON t.owner_discord_id = uc.discord_id
            GROUP BY t.id, t.name, t.owner_discord_id, t.owner_username, t.discord_user,
                     t.gk_card_id, t.vl_card_id, t.pv_card_id, t.wins, t.losses,
                     t.goals_for, t.goals_against, t.created_at, t.updated_at,
                     p.username, p.level, p.purple_coins
            ORDER BY t.created_at DESC
        `;

        const rows = await query(sql);
        return rows.map(row => ({
            id: row.id,
            team_name: row.team_name,
            owner_discord_id: row.owner_discord_id,
            owner_username: row.owner_username,
            discord_user: row.discord_user,
            gk_card_id: row.gk_card_id,
            vl_card_id: row.vl_card_id,
            pv_card_id: row.pv_card_id,
            wins: row.wins,
            losses: row.losses,
            goals_for: row.goals_for,
            goals_against: row.goals_against,
            created_at: row.created_at,
            updated_at: row.updated_at,
            owner_stats: {
                display_name: row.owner_display_name,
                level: row.owner_level,
                purple_coins: row.owner_coins,
                bagre_cards: row.bagre_cards || 0,
                medio_cards: row.medio_cards || 0,
                goat_cards: row.goat_cards || 0,
                prime_cards: row.prime_cards || 0,
                total_cards: row.total_cards || 0
            }
        }));
    } catch (error) {
        console.error('Erro ao buscar times com stats:', error);
        throw error;
    }
};

module.exports = {
    createTeam,
    getTeamById,
    getTeamByName,
    getTeamByOwner,
    updateTeam,
    // Wrapper usado por comandos antigos (ex: escalar.js)
    updateTeamFormation: async (teamId, updateData) => {
        // Apenas delega para updateTeam permitindo atualização parcial (gk_card_id, vl_card_id, pv_card_id)
        return await updateTeam(teamId, updateData);
    },
    updateTeamLineup,
    updateTeamStats,
    deleteTeam,
    getAllTeams,
    getTeamsWithFullLineup,
    teamExists,
    getTeamsWithStats
};