const { query } = require('../connection');

// Cria tabela se não existir (id, name, date, time, format, max_teams, prize_1st, prize_2nd, prize_3rd, status)
async function ensureTable() {
  const sql = `CREATE TABLE IF NOT EXISTS tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    format VARCHAR(50) NOT NULL,
    max_teams INT NOT NULL DEFAULT 16,
    prize_1st VARCHAR(100),
    prize_2nd VARCHAR(100),
    prize_3rd VARCHAR(100),
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;
  await query(sql);

  const sqlIns = `CREATE TABLE IF NOT EXISTS tournament_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    team_id INT NOT NULL,
    owner_discord_id VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tournament_team (tournament_id, team_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
  )`;
  await query(sqlIns);
}

async function listTournaments() {
  await ensureTable();
  const rows = await query('SELECT * FROM tournaments ORDER BY date ASC');
  return rows;
}

async function getTournamentByName(name) {
  await ensureTable();
  const rows = await query('SELECT * FROM tournaments WHERE LOWER(name)=LOWER(?) LIMIT 1', [name]);
  return rows[0] || null;
}

async function registerTeam(tournamentId, teamId, ownerDiscordId) {
  await ensureTable();
  try {
    await query('INSERT INTO tournament_registrations (tournament_id, team_id, owner_discord_id) VALUES (?, ?, ?)', [tournamentId, teamId, ownerDiscordId]);
    return true;
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return false; // já inscrito
    throw e;
  }
}

async function countRegistrations(tournamentId) {
  const rows = await query('SELECT COUNT(*) as total FROM tournament_registrations WHERE tournament_id=?', [tournamentId]);
  return rows[0]?.total || 0;
}

async function listRegistrations(tournamentId) {
  const rows = await query(`SELECT tr.*, t.name as team_name FROM tournament_registrations tr
    LEFT JOIN teams t ON tr.team_id = t.id
    WHERE tr.tournament_id=? ORDER BY tr.created_at ASC`, [tournamentId]);
  return rows;
}

module.exports = { listTournaments, getTournamentByName, registerTeam, countRegistrations, listRegistrations };