const express = require('express');
const cors = require('cors');
const { getPlayersWithStats } = require('../database/models/player');
const { getTeamsWithStats } = require('../database/models/team');

// Criar router para APIs locais
const apiRouter = express.Router();

// Middleware CORS
apiRouter.use(cors());

// API para buscar todos os players com estatísticas completas
apiRouter.get('/players', async (req, res) => {
    try {
        const players = await getPlayersWithStats();
        res.json(players);
    } catch (error) {
        console.error('Erro ao buscar players:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

// API para buscar todos os times com informações dos donos
apiRouter.get('/teams', async (req, res) => {
    try {
        const teams = await getTeamsWithStats();
        res.json(teams);
    } catch (error) {
        console.error('Erro ao buscar teams:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

// API para buscar torneios
apiRouter.get('/tournaments', async (req, res) => {
    try {
        // TODO: Implementar busca de torneios quando necessário
        res.json([]);
    } catch (error) {
        console.error('Erro ao buscar torneios:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

// API para buscar templates de jogadores
apiRouter.get('/templates', async (req, res) => {
    try {
        const { getAllTemplates } = require('../database/models/template');
        const templates = await getAllTemplates();
        res.json(templates);
    } catch (error) {
        console.error('Erro ao buscar templates:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

// API para buscar template específico por ID
apiRouter.get('/templates/:id', async (req, res) => {
    try {
        const { getTemplateById } = require('../database/models/template');
        const template = await getTemplateById(req.params.id);

        if (!template) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        res.json(template);
    } catch (error) {
        console.error('Erro ao buscar template:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

// API para buscar time específico por ID
apiRouter.get('/teams/:id', async (req, res) => {
    try {
        const { getTeamById } = require('../database/models/team');
        const team = await getTeamById(req.params.id);

        if (!team) {
            return res.status(404).json({ error: 'Time não encontrado' });
        }

        res.json(team);
    } catch (error) {
        console.error('Erro ao buscar time:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

// API para estatísticas gerais
apiRouter.get('/stats', async (req, res) => {
    try {
        const players = await getPlayersWithStats();
        const teams = await getTeamsWithStats();

        const stats = {
            total_players: players.length,
            total_teams: teams.length,
            total_purple_coins: players.reduce((sum, p) => sum + (p.purple_coins || 0), 0),
            total_cards: players.reduce((sum, p) => sum + (p.team_stats.total_cards || 0), 0),
            players_with_teams: players.filter(p => p.team_name && p.team_name !== 'Sem time').length
        };

        res.json(stats);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

module.exports = apiRouter;
