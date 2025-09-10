const express = require('express');
const { query } = require('./db');

const router = express.Router();

// GET /api/tournaments - Listar todos os torneios
router.get('/', async (req, res) => {
    try {
        const tournaments = await query(`
            SELECT 
                t.*,
                COUNT(tr.id) as registered_teams
            FROM tournaments t
            LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `);

        res.json({
            success: true,
            tournaments: tournaments
        });
    } catch (error) {
        console.error('❌ Erro ao buscar torneios:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// POST /api/tournaments - Criar novo torneio
router.post('/', async (req, res) => {
    try {
        let { name, date, time, format, max_players, max_teams, prize_1st, prize_2nd, prize_3rd } = req.body;

        // Permitir max_players ou max_teams (normalizar para max_teams)
        if (!max_teams && max_players) max_teams = max_players;

        if (!name || !date || !time || !format || !max_teams || !prize_1st || !prize_2nd || !prize_3rd) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        // Validar número de times permitido 8 / 16 / 32
        const allowedTeamSizes = [8, 16, 32];
        if (!allowedTeamSizes.includes(Number(max_teams))) {
            return res.status(400).json({
                success: false,
                message: 'max_teams deve ser 8, 16 ou 32'
            });
        }

        // Validar formatos básicos
        const allowedFormats = ['Mata-mata', 'Liga', 'Grupos+Mata'];
        if (!allowedFormats.includes(format)) {
            return res.status(400).json({
                success: false,
                message: `Formato inválido. Use: ${allowedFormats.join(', ')}`
            });
        }

        // Verificar se já existe um torneio com o mesmo nome
        const existing = await query('SELECT id FROM tournaments WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um torneio com este nome'
            });
        }

        // Ajustar status inicial para 'upcoming'
        const result = await query(`
            INSERT INTO tournaments (name, date, time, format, max_teams, prize_1st, prize_2nd, prize_3rd, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')
        `, [name, date, time, format, max_teams, prize_1st, prize_2nd, prize_3rd]);

        res.json({
            success: true,
            message: 'Torneio criado com sucesso!',
            tournament_id: result.insertId,
            normalized: { max_teams: Number(max_teams), format }
        });
    } catch (error) {
        console.error('❌ Erro ao criar torneio:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// DELETE /api/tournaments/:id - Deletar torneio
router.delete('/:id', async (req, res) => {
    try {
        const tournamentId = req.params.id;

        // Verificar se o torneio existe
        const tournament = await query('SELECT id FROM tournaments WHERE id = ?', [tournamentId]);
        if (tournament.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Torneio não encontrado'
            });
        }

        // Deletar inscrições primeiro
        await query('DELETE FROM tournament_registrations WHERE tournament_id = ?', [tournamentId]);
        
        // Deletar torneio
        await query('DELETE FROM tournaments WHERE id = ?', [tournamentId]);

        res.json({
            success: true,
            message: 'Torneio deletado com sucesso!'
        });
    } catch (error) {
        console.error('❌ Erro ao deletar torneio:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// GET /api/tournaments/:id/registrations - Listar inscrições do torneio
router.get('/:id/registrations', async (req, res) => {
    try {
        const tournamentId = req.params.id;

        const registrations = await query(`
            SELECT 
                tr.*,
                t.name as team_name,
                t.owner_id,
                u.name as owner_username
            FROM tournament_registrations tr
            JOIN teams t ON tr.team_id = t.id
            LEFT JOIN users u ON t.owner_id = u.discord_id
            WHERE tr.tournament_id = ?
            ORDER BY tr.registered_at ASC
        `, [tournamentId]);

        res.json({
            success: true,
            registrations: registrations
        });
    } catch (error) {
        console.error('❌ Erro ao buscar inscrições:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
