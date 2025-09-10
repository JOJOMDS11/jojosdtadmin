const { query } = require('../connection');

// Buscar todos os templates
const getAllTemplates = async () => {
    try {
        const sql = `
            SELECT 
                id,
                name,
                position,
                avatar,
                created_at
            FROM player_templates
            ORDER BY created_at DESC
        `;

        const rows = await query(sql);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar todos os templates:', error);
        throw error;
    }
};

// Buscar template por ID
const getTemplateById = async (templateId) => {
    try {
        const sql = `
            SELECT 
                id,
                name,
                position,
                avatar,
                created_at
            FROM player_templates
            WHERE id = ?
        `;

        const rows = await query(sql, [templateId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar template por ID:', error);
        throw error;
    }
};

// Buscar template por nome
const getTemplateByName = async (name) => {
    try {
        const sql = `
            SELECT 
                id,
                name,
                position,
                avatar,
                created_at
            FROM player_templates
            WHERE LOWER(name) = LOWER(?)
        `;

        const rows = await query(sql, [name]);
        return rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar template por nome:', error);
        throw error;
    }
};

// Criar novo template
const createTemplate = async (templateData) => {
    try {
        const sql = `
            INSERT INTO player_templates (name, position, avatar)
            VALUES (?, ?, ?)
        `;

        const values = [
            templateData.name,
            templateData.position,
            templateData.avatar || null
        ];

        const result = await query(sql, values);
        return result.insertId;
    } catch (error) {
        console.error('Erro ao criar template:', error);
        throw error;
    }
};

// Deletar template
const deleteTemplate = async (templateId) => {
    try {
        const sql = 'DELETE FROM player_templates WHERE id = ?';
        const result = await query(sql, [templateId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao deletar template:', error);
        throw error;
    }
};

// Buscar templates por posição
const getTemplatesByPosition = async (position) => {
    try {
        const sql = `
            SELECT 
                id,
                name,
                position,
                avatar,
                created_at
            FROM player_templates
            WHERE position = ?
            ORDER BY created_at DESC
        `;

        const rows = await query(sql, [position]);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar templates por posição:', error);
        throw error;
    }
};

// Contar total de templates
const countTemplates = async () => {
    try {
        const sql = 'SELECT COUNT(*) as total FROM player_templates';
        const rows = await query(sql);
        return rows[0].total;
    } catch (error) {
        console.error('Erro ao contar templates:', error);
        throw error;
    }
};

module.exports = {
    getAllTemplates,
    getTemplateById,
    getTemplateByName,
    createTemplate,
    deleteTemplate,
    getTemplatesByPosition,
    countTemplates
};
