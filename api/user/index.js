// Unified API handler for Vercel Hobby plan (max 12 functions)
// All admin-panel API endpoints are routed here

const teams = require('./teams');
const players = require('./players');
const templates = require('./templates');
const tournaments = require('./tournaments');
const stats = require('./stats');
const login = require('./login');
const coins = require('./coins');
const avatars = require('./avatars');
const health = require('./health');
const user = require('./user');

module.exports = async (req, res) => {
  const { url, method } = req;

  // Routing logic
  if (url.startsWith('/api/teams')) return teams(req, res);
  if (url.startsWith('/api/players')) return players(req, res);
  if (url.startsWith('/api/templates')) return templates(req, res);
  if (url.startsWith('/api/tournaments')) return tournaments(req, res);
  if (url.startsWith('/api/stats')) return stats(req, res);
  if (url.startsWith('/api/login')) return login(req, res);
  if (url.startsWith('/api/coins')) return coins(req, res);
  if (url.startsWith('/api/avatars')) return avatars(req, res);
  if (url.startsWith('/api/health')) return health(req, res);
  if (url.startsWith('/api/user')) return user(req, res);

  res.statusCode = 404;
  res.end('Not found');
};
