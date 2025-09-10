const { query } = require('../connection');

const getAllTemplates = async () => {
    try {
        const sql = `
            SELECT id, name, position, avatar, created_at
            FROM player_templates 
            ORDER BY name ASC
        `;

        const rows = await query(sql);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar templates:', error);
        throw error;
    }
};

const getTemplateById = async (id) => {
    try {
        const sql = `
            SELECT id, name, position, avatar, created_at
            FROM player_templates 
            WHERE id = ?
        `;

        const rows = await query(sql, [id]);
        return rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar template:', error);
        throw error;
    }
};

const createTemplate = async (templateData) => {
    try {
        const sql = `
            INSERT INTO player_templates (name, position, avatar)
            VALUES (?, ?, ?)
        `;

        const values = [
            templateData.name,
            templateData.position,
            templateData.avatar
        ];

        const result = await query(sql, values);
        return result.insertId;
    } catch (error) {
        console.error('Erro ao criar template:', error);
        throw error;
    }
};

const updateTemplate = async (id, templateData) => {
    try {
        const fields = [];
        const values = [];

        if (templateData.name !== undefined) {
            fields.push('name = ?');
            values.push(templateData.name);
        }

        if (templateData.position !== undefined) {
            fields.push('position = ?');
            values.push(templateData.position);
        }

        if (templateData.avatar !== undefined) {
            fields.push('avatar = ?');
            values.push(templateData.avatar);
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(id);

        const sql = `
            UPDATE player_templates 
            SET ${fields.join(', ')} 
            WHERE id = ?
        `;

        const result = await query(sql, values);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao atualizar template:', error);
        throw error;
    }
};

const deleteTemplate = async (id) => {
    try {
        const sql = `
            DELETE FROM player_templates 
            WHERE id = ?
        `;

        const result = await query(sql, [id]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Erro ao deletar template:', error);
        throw error;
    }
};

const getRandomTemplate = async () => {
    try {
        const sql = `
            SELECT id, name, position, avatar
            FROM player_templates 
            ORDER BY RAND() 
            LIMIT 1
        `;

        const rows = await query(sql);
        return rows[0] || null;
    } catch (error) {
        console.error('Erro ao buscar template aleatório:', error);
        throw error;
    }
};

const checkTemplateExists = async (name) => {
    try {
        const sql = `
            SELECT id FROM player_templates 
            WHERE LOWER(name) = LOWER(?)
        `;

        const rows = await query(sql, [name]);
        return rows.length > 0;
    } catch (error) {
        console.error('Erro ao verificar template:', error);
        throw error;
    }
};

const getTemplatesByPosition = async (position) => {
    try {
        const sql = `
            SELECT id, name, position, avatar
            FROM player_templates 
            WHERE position = ?
            ORDER BY name ASC
        `;

        const rows = await query(sql, [position]);
        return rows;
    } catch (error) {
        console.error('Erro ao buscar templates por posição:', error);
        throw error;
    }
};

module.exports = {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getRandomTemplate,
    checkTemplateExists,
    getTemplatesByPosition
};
